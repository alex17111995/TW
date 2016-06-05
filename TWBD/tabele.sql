drop table static_targets;
drop table child_handlers;
drop table children_Location;
drop table parents_Location;
drop table children;
drop table parents;


CREATE TABLE children(
kid INTEGER PRIMARY KEY,
username VARCHAR(30) NOT NULL,
passwordHash VARCHAR(30) NOT NULL,
firstName VARCHAR(30),
lastName VARCHAR(30),
unique (username)
)
/

CREATE TABLE parents(
pid INTEGER PRIMARY KEY,
username VARCHAR(30) NOT NULL,
passwordHash VARCHAR(30) NOT NULL,
firstName VARCHAR(30),
lastName VARCHAR(30),
unique(username)
)
/


CREATE TABLE children_Location(
kid INTEGER ,
latitude BINARY_DOUBLE NOT NULL,
longitude BINARY_DOUBLE NOT NULL,
is_online INTEGER NOT NULL,
last_update_timestamp TIMESTAMP NOT NULL,
CONSTRAINT fk_kid_location
	FOREIGN KEY (kid) REFERENCES children(kid)
)
/
CREATE TABLE parents_Location(
pid INTEGER ,
latitude BINARY_DOUBLE NOT NULL,
longitude BINARY_DOUBLE NOT NULL,
is_online INTEGER NOT NULL,
last_timestamp_update TIMESTAMP NOT NULL,
CONSTRAINT fk_parents_location
	FOREIGN KEY (pid) REFERENCES parents(pid)
)
/

CREATE TABLE child_handlers(
kid INTEGER,
pid INTEGER,
permission INTEGER,
is_dynamic_target NUMBER(1),
radius_dynamic_target INTEGER,
unique(kid,pid)
)
/
CREATE TABLE static_targets(
static_target_id INTEGER PRIMARY KEY,
kid INTEGER NOT NULL,
latitude BINARY_DOUBLE NOT NULL,
longitude BINARY_DOUBLE NOT NULL,
radius INTEGER NOT NULL,
status INTEGER NOT NULL
)
/



drop sequence static_targets_sequence;
drop sequence children_seq;
CREATE sequence children_seq;
drop sequence parents_seq;
CREATE sequence parents_seq;
CREATE sequence static_targets_sequence;
