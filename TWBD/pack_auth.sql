set serveroutput on;
CREATE OR REPLACE PACKAGE pack_auth AS
	PROCEDURE add_user(p_type VARCHAR, p_username VARCHAR, p_password VARCHAR);
	PROCEDURE log_user(p_type VARCHAR, p_username VARCHAR, p_password VARCHAR, p_id OUT INTEGER);
	--PROCEDURE setName(p_type VARCHAR,p_id INTEGER,p_first_name VARCHAR,p_last_name VARCHAR);
	PROCEDURE register_child(p_pid INTEGER, p_username VARCHAR, p_password VARCHAR,p_first VARCHAR,p_last_name VARCHAR,p_kid OUT INTEGER);
	duplicate_username exception;
	PRAGMA EXCEPTION_INIT(duplicate_username, -20001);
	invalid_user exception;
	PRAGMA EXCEPTION_INIT(invalid_user, -20002);
END pack_auth;
/

CREATE OR REPLACE PACKAGE BODY pack_auth IS
 	
	PROCEDURE add_user(p_type VARCHAR, p_username VARCHAR, p_password VARCHAR) IS
	BEGIN
		IF p_type = 'kid' THEN
			INSERT INTO children(kid,username,passwordHash) values (children_seq.NEXTVAL,p_username,p_password);
		END IF;
		IF p_type = 'parent' THEN
			INSERT INTO parents(pid,username,passwordHash) values (parents_seq.NEXTVAL,p_username,p_password);
		END IF;
		EXCEPTION
			WHEN DUP_VAL_ON_INDEX THEN
				DBMS_OUTPUT.PUT_LINE('Duplicate value on an index');
				raise duplicate_username;
	END;

	PROCEDURE register_child(p_pid INTEGER, p_username VARCHAR, p_password VARCHAR,p_first VARCHAR,p_last_name VARCHAR,p_kid OUT INTEGER) IS
	BEGIN
		p_kid:=children_seq.NEXTVAL;
		INSERT INTO children values
			(p_kid,p_username,p_password,p_first,p_last_name);
		INSERT INTO child_handlers(pid,kid) values
			(p_pid,p_kid);


		EXCEPTION
			WHEN DUP_VAL_ON_INDEX THEN
				DBMS_OUTPUT.PUT_LINE('Duplicate value on an index');
				raise duplicate_username;
			WHEN OTHERS THEN
				raise invalid_user;
	END;


	PROCEDURE log_user(p_type VARCHAR, p_username VARCHAR, p_password VARCHAR, p_id OUT INTEGER) IS
	BEGIN
		IF p_type = 'kid' THEN
			select kid INTO p_id from children where username=p_username and  passwordHash = p_password;
		END IF;
		IF p_type = 'parent' THEN
			SELECT pid into p_id from parents where username=p_username and  passwordHash = p_password;
		END IF;
		EXCEPTION
			WHEN NO_DATA_FOUND THEN
				raise invalid_user;
	END;

END pack_auth;
/
DECLARE
	v_id INTEGER;
BEGIN
	pack_auth.register_child(1,'alexfafaf','alex','ciubi','ciuc');

END;
/