solve this docker image build:

need-for-wheels git:(main) ✗ docker comp
ose up -d
[+] Building 0.9s (10/10) FINISHED         
 => [internal] load local bake defin  0.0s
 => => reading from stdin 1.06kB      0.0s
 => [db internal] load build definit  0.0s
 => => transferring dockerfile: 195B  0.0s
 => [backend internal] load build de  0.0s
 => => transferring dockerfile: 577B  0.0s
 => CANCELED [backend] resolve image  0.6s
 => [db internal] load metadata for   0.6s
 => [auth] docker/dockerfile:pull to  0.0s
 => [db internal] load .dockerignore  0.0s
 => => transferring context: 2B       0.0s
 => [db internal] load build context  0.0s
 => => transferring context: 2B       0.0s
 => [db 1/2] FROM docker.io/library/  0.0s
 => ERROR [db 2/2] COPY migrations /  0.0s
------
 > [db 2/2] COPY migrations /docker-entrypoint-initdb.d/:
------
Dockerfile:7

--------------------

   5 |         POSTGRES_DB=nfw_db

   6 |     

   7 | >>> COPY migrations /docker-entrypoint-initdb.d/

   8 |     

--------------------

target db: failed to solve: failed to compute cache key: failed to calculate checksum of ref 2a04d1d8-3a7a-4c79-9e3f-0cc9363a45dd::zl3vsemoixteaev5p97335p88: "/migrations": not found



View build details: docker-desktop://dashboard/build/desktop-linux/desktop-linux/5kkxyx0op9rya9yni61huw8lq