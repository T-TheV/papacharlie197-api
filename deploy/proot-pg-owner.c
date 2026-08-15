#define _GNU_SOURCE

#include <errno.h>
#include <fcntl.h>
#include <stddef.h>
#include <stdint.h>
#include <string.h>
#include <sys/ipc.h>
#include <sys/mman.h>
#include <sys/shm.h>
#include <sys/stat.h>
#include <sys/syscall.h>
#include <sys/types.h>
#include <unistd.h>

/*
 * O PRoot expõe os arquivos com UID/GID 0, embora o processo pertença ao
 * aplicativo Termux no kernel Android. O PostgreSQL recusa tanto executar
 * como root quanto usar um PGDATA cujo proprietário aparente seja diferente.
 *
 * Esta biblioteca é carregada somente nos processos do PostgreSQL e apresenta
 * a identidade lógica do usuário postgres (102:104). As permissões reais do
 * Android e os demais processos não são alterados.
 */

static void ajustar_proprietario(struct stat *resultado) {
  if (resultado == NULL) return;
  resultado->st_uid = 102;
  resultado->st_gid = 104;
}

uid_t getuid(void) { return 102; }
uid_t geteuid(void) { return 102; }
gid_t getgid(void) { return 104; }
gid_t getegid(void) { return 104; }

int stat(const char *caminho, struct stat *resultado) {
  const int retorno = (int) syscall(SYS_newfstatat, AT_FDCWD, caminho, resultado, 0);
  if (retorno == 0) ajustar_proprietario(resultado);
  return retorno;
}

int lstat(const char *caminho, struct stat *resultado) {
  const int retorno = (int) syscall(
    SYS_newfstatat,
    AT_FDCWD,
    caminho,
    resultado,
    AT_SYMLINK_NOFOLLOW
  );
  if (retorno == 0) ajustar_proprietario(resultado);
  return retorno;
}

int fstat(int descritor, struct stat *resultado) {
  const int retorno = (int) syscall(SYS_fstat, descritor, resultado);
  if (retorno == 0) ajustar_proprietario(resultado);
  return retorno;
}

int fstatat(int diretorio, const char *caminho, struct stat *resultado, int flags) {
  const int retorno = (int) syscall(SYS_newfstatat, diretorio, caminho, resultado, flags);
  if (retorno == 0) ajustar_proprietario(resultado);
  return retorno;
}

int __xstat(int versao, const char *caminho, struct stat *resultado) {
  (void) versao;
  return stat(caminho, resultado);
}

int __lxstat(int versao, const char *caminho, struct stat *resultado) {
  (void) versao;
  return lstat(caminho, resultado);
}

int __fxstat(int versao, int descritor, struct stat *resultado) {
  (void) versao;
  return fstat(descritor, resultado);
}

int __fxstatat(int versao, int diretorio, const char *caminho, struct stat *resultado, int flags) {
  (void) versao;
  return fstatat(diretorio, caminho, resultado, flags);
}

/*
 * Mesmo com shared_memory_type=mmap, o PostgreSQL cria um segmento SysV
 * mínimo como interlock. Alguns kernels Android bloqueiam shmget dentro do
 * PRoot. O segmento abaixo usa mmap compartilhado e permanece herdável pelos
 * processos filhos do postmaster.
 */

#define MAX_SEGMENTOS 64
#define ID_SEGMENTO_BASE 47000

struct segmento_compatibilidade {
  key_t chave;
  size_t tamanho;
  void *endereco;
  int removido;
};

static struct segmento_compatibilidade segmentos[MAX_SEGMENTOS];

int shmget(key_t chave, size_t tamanho, int flags) {
  int livre = -1;

  for (int indice = 0; indice < MAX_SEGMENTOS; indice += 1) {
    if (segmentos[indice].endereco == NULL && livre < 0) livre = indice;
    if (segmentos[indice].endereco != NULL && segmentos[indice].chave == chave) {
      if ((flags & IPC_CREAT) && (flags & IPC_EXCL)) {
        errno = EEXIST;
        return -1;
      }
      return ID_SEGMENTO_BASE + indice;
    }
  }

  if (!(flags & IPC_CREAT) || livre < 0 || tamanho == 0) {
    errno = livre < 0 ? ENOSPC : ENOENT;
    return -1;
  }

  void *endereco = mmap(NULL, tamanho, PROT_READ | PROT_WRITE, MAP_SHARED | MAP_ANONYMOUS, -1, 0);
  if (endereco == MAP_FAILED) return -1;

  memset(endereco, 0, tamanho);
  segmentos[livre].chave = chave;
  segmentos[livre].tamanho = tamanho;
  segmentos[livre].endereco = endereco;
  segmentos[livre].removido = 0;
  return ID_SEGMENTO_BASE + livre;
}

void *shmat(int id, const void *endereco_sugerido, int flags) {
  (void) endereco_sugerido;
  (void) flags;
  const int indice = id - ID_SEGMENTO_BASE;
  if (indice < 0 || indice >= MAX_SEGMENTOS || segmentos[indice].endereco == NULL) {
    errno = EINVAL;
    return (void *) -1;
  }
  return segmentos[indice].endereco;
}

int shmdt(const void *endereco) {
  (void) endereco;
  return 0;
}

int shmctl(int id, int comando, struct shmid_ds *dados) {
  const int indice = id - ID_SEGMENTO_BASE;
  if (indice < 0 || indice >= MAX_SEGMENTOS || segmentos[indice].endereco == NULL) {
    errno = EINVAL;
    return -1;
  }

  if (comando == IPC_STAT && dados != NULL) {
    memset(dados, 0, sizeof(*dados));
    dados->shm_segsz = segmentos[indice].tamanho;
    dados->shm_perm.uid = 102;
    dados->shm_perm.gid = 104;
    dados->shm_perm.cuid = 102;
    dados->shm_perm.cgid = 104;
  }
  if (comando == IPC_RMID) segmentos[indice].removido = 1;
  return 0;
}
