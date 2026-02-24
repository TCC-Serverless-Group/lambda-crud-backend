import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  throw new Error("REACT_APP_SUPABASE_ANON_KEY não definida no build.")
}

if (!supabaseUrl) {
  throw new Error("REACT_APP_SUPABASE_URL não definida no build.")
}

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
  return { data }; // data.session.access_token -> o que enviamos para o Lambda
}

async function signIn(email, password) {
  const { user, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });
  return { user, error };
}

async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

const authentication = { signUp, signIn, signOut, getSession};

export default authentication;