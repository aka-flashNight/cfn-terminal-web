import axios, { type AxiosInstance } from 'axios'

export const BASE_URL = 'http://127.0.0.1:7077'

const request: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json'
  }
})

request.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

export default request
