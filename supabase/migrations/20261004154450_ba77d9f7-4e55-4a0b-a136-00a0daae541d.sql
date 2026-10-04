
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.check_subject_owner() from public, anon, authenticated;
revoke execute on function public.has_role(uuid, app_role) from public, anon;
grant execute on function public.has_role(uuid, app_role) to authenticated;
