CREATE OR REPLACE PACKAGE pack_child_handlers AS
	PROCEDURE request_kid_access(p_pid parents.pid%TYPE,p_kid children.kid%TYPE,p_permission child_handlers.permission%TYPE);
end pack_child_handlers;
/
CREATE OR REPLACE PACKAGE BODY pack_child_handlers AS
	PROCEDURE request_kid_access(p_pid parents.pid%TYPE,p_kid children.kid%TYPE,p_permission child_handlers.permission%TYPE);
		
end pack_child_handlers;
/