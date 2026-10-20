import axios from 'axios'

export async function verifyCredentials(username, password) {
  await axios.get('/api/customers', { auth: { username, password } })
  return { username, password }
}