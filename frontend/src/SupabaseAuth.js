import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl,supabaseAnonKey);


async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
  });
  return { data, error }; // data.session.access_token -> o que enviamos para o Lambda
}

async function getSession() {
  const { data } = await supabase.auth.getSession();
  return  data ; // { session, user }
}

async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });
  
  return {
    user: data?.user,
    session: data?.session,
    error,
  };
}

async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

const authentication = { signUp, signIn, signOut, getSession};

export default authentication;