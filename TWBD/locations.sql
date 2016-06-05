
CREATE OR REPLACE PROCEDURE update_location_parent(p_pid parents.pid%TYPE ,p_latitude parents_location.latitude%TYPE,
						 p_longitude parents_location.longitude%TYPE,p_is_online parents_location.is_online%TYPE,p_timestamp OUT parents_location.last_timestamp_update%TYPE) IS
	v_count integer;
	BEGIN
		p_timestamp:=systimestamp;
		SELECT COUNT(*) into v_count from parents_location  where pid=p_pid;
		IF v_count>0 THEN
			UPDATE parents_location set latitude=p_latitude,longitude=p_longitude,is_online=p_is_online,last_timestamp_update=systimestamp where pid=p_pid;
		ELSE
		INSERT INTO parents_location(pid,latitude,longitude,is_online,last_timestamp_update) 
			values (p_pid,p_latitude,p_longitude,p_is_online,p_timestamp);
		END IF;
	END;
/



CREATE OR REPLACE PROCEDURE update_location_child(p_kid children.kid%TYPE ,p_latitude children_location.latitude%TYPE,
						 p_longitude children_location.longitude%TYPE,p_is_online children_location.is_online%TYPE,p_timestamp OUT TIMESTAMP) IS
	v_count integer;
	BEGIN
		p_timestamp:=systimestamp;
		SELECT COUNT(*) into v_count from children_location  where kid=p_kid;
		IF v_count>0 THEN
			UPDATE children_location set latitude=p_latitude,longitude=p_longitude,is_online=p_is_online,last_update_timestamp=systimestamp where kid=p_kid;
		ELSE
		INSERT INTO children_location(kid,latitude,longitude,is_online,last_update_timestamp) 
			values (p_kid,p_latitude,p_longitude,p_is_online,p_timestamp);
		END IF;
	END;
/
