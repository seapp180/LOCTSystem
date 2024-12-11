FROM node:20
 
WORKDIR /usr/src/app
 
# RUN apt-get update && apt-get install -y --no-install-recommends  postgresql-client postgresql nano vim libaio1 

RUN apt-get update && apt-get install -y --no-install-recommends alien postgresql-client postgresql nano vim libaio1 wget && \
    wget https://download.oracle.com/otn_software/linux/instantclient/185000/oracle-instantclient18.5-basiclite-18.5.0.0.0-3.x86_64.rpm && \
    wget https://download.oracle.com/otn_software/linux/instantclient/185000/oracle-instantclient18.5-devel-18.5.0.0.0-3.x86_64.rpm && \
    alien -i oracle-instantclient18.5-basiclite-18.5.0.0.0-3.x86_64.rpm && \
    alien -i oracle-instantclient18.5-devel-18.5.0.0.0-3.x86_64.rpm
 
ENV LD_LIBRARY_PATH="/usr/lib/oracle/18.5/client64/lib:${LD_LIBRARY_PATH}"
 
COPY ./tnsnames.ora /usr/lib/oracle/18.5/client64/lib/network/admin/tnsnames.ora

COPY package*.json ./
 
RUN npm install
 
COPY . .
 
EXPOSE 3001
 
CMD ["node", "Server.cjs"]