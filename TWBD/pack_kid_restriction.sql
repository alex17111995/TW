CREATE OR REPLACE PACKAGE pack_kid_restrictions AS
	
	PROCEDURE add_static_restriction
		(p_pid child_handlers.pid%TYPE,p_kid child_handlers.kid%TYPE,
			p_latitude static_targets.latitude%TYPE,p_longitude static_targets.longitude%TYPE,
			p_radius static_targets.radius%TYPE,p_id_static OUT static_targets.static_target_id%TYPE);
	no_permission exception;
	PROCEDURE delete_static_restriction
		(p_pid child_handlers.pid%TYPE,p_id_static static_targets.static_target_id%TYPE,p_kid OUT child_handlers.kid%TYPE);
	PRAGMA EXCEPTION_INIT(no_permission, -20003);
END pack_kid_restrictions;
/

CREATE OR REPLACE PACKAGE BODY pack_kid_restrictions IS
	
	PROCEDURE get_static_targets_of_children
		(p_pid child_handlers.pid%TYPE, cursor_static_targets OUT sys_refcursor,
		last_acquired_st_id  OUT static_targets.static_target_id%TYPE) IS
	BEGIN
		OPEN cursor_static_targets FOR
		 SELECT kid,static_target_id,latitude,longitude,radius,status 
		 from static_targets natural join child_handlers 
		where pid=p_pid  and status=1; --ACTIVATED
		SELECT MAX(static_target_id) INTO last_acquired_st_id from static_targets;
	END;

	FUNCTION verify_permission(p_pid child_handlers.pid%TYPE, p_kid child_handlers.kid%TYPE)
		RETURN INTEGER IS
		ret_value INTEGER;
	BEGIN
		SELECT COUNT(*) into ret_value from  child_handlers where pid=p_pid and kid=p_kid;
		return ret_value;
	END;


	PROCEDURE get_static_targets_of_child
		(p_kid child_handlers.kid%TYPE,cursor_static_targets OUT sys_refcursor,
			last_acquired_st_id OUT static_targets.static_target_id%TYPE) IS
		BEGIN
		OPEN cursor_static_targets FOR
			 SELECT kid,static_target_id,latitude,longitude,radius,status 
			 from static_targets
			where kid=p_kid  and status=1; --ACTIVATED
		END;

	PROCEDURE delete_static_restriction
		(p_pid child_handlers.pid%TYPE,p_id_static static_targets.static_target_id%TYPE,p_kid OUT child_handlers.kid%TYPE) IS
		
		BEGIN
			SELECT kid into p_kid from static_targets where p_id_static=static_target_id;
			IF verify_permission(p_pid,p_kid) =0 THEN
			 	raise no_permission;
			 END IF;

			DELETE static_targets where  static_target_id=p_id_static;
			exception
				when no_data_found THEN
				raise no_permission;


		END;


	PROCEDURE add_static_restriction
		(p_pid child_handlers.pid%TYPE,p_kid child_handlers.kid%TYPE,
			p_latitude static_targets.latitude%TYPE,p_longitude static_targets.longitude%TYPE,
			p_radius static_targets.radius%TYPE,p_id_static OUT static_targets.static_target_id%TYPE ) IS
	BEGIN
	IF verify_permission(p_pid,p_kid) = 0 THEN
		raise no_permission;
	ELSE 
		 p_id_static:= static_targets_sequence.NEXTVAL;
		INSERT into static_targets values(p_id_static,p_kid,p_longitude,p_longitude,p_radius,1);
	END IF;
	END;

END pack_kid_restrictions;
/
DECLARE
	blabla INTEGER;
BEGIN
	pack_kid_restrictions.add_static_restriction(2,1,20,20,20,blabla);
END;
/


