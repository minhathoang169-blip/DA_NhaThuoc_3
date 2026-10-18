import axios from 'axios'

export async function verifyCredentials(username, password) {
  await axios.get('/api/auth/me', { auth: { username, password } })
  return { username, password }
}
