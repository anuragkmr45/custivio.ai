# Custivio Data VM

The data VM runs PostgreSQL, MinIO, and Valkey on private interfaces. It owns persistent storage under `/srv/custivio-data`, config under `/etc/custivio-data`, and backups under `/var/backups/custivio`.

Docker Compose is the preferred install method for this project because the existing production artifacts already use Compose for these data services. Bare-metal installation is acceptable if it preserves the same paths, ports, backup scripts, and firewall rules.
