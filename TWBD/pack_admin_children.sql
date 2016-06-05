set serveroutput on;
CREATE OR REPLACE PACKAGE pack_admin_children AS
	PROCEDURE get_child_information(p_kid children.kid%TYPE,child_info_obj OUT child_info);
END pack_admin_children;
/




CREATE OR REPLACE PACKAGE BODY pack_admin_children AS
	PROCEDURE collect_child_handlers(p_kid child_handlers.kid%TYPE
		,table_info OUT table_child_handler_info ) IS	
	BEGIN

		SELECT child_handler_info(pid,username,firstname,lastName,permission)
			BULK COLLECT INTO table_info FROM parents natural join child_handlers where kid=p_kid;
	END;


	PROCEDURE get_child_information(p_kid children.kid%TYPE,child_info_obj OUT child_info) IS
		child_information_instance child_info;
		v_username children.username%TYPE;
		v_first_name children.firstName%TYPE;
		v_last_name children.lastName%TYPE;
		table_child_handlers table_child_handler_info;
	BEGIN
		SELECT username,firstname,lastname into v_username,v_first_name,v_last_name from children where kid=p_kid;
		collect_child_handlers(p_kid,table_child_handlers);
		child_info_obj:=child_info(p_kid,v_username,v_first_name,v_last_name,table_child_handlers);
	END;
END pack_admin_children;
/


DECLARE
bla	child_info;
BEGIN
 pack_admin_children.get_child_information(1, bla);
 DBMS_OUTPUT.PUT_LINE(bla.username);
END;
/