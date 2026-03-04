import axios, { type AxiosInstance } from 'axios'

const request: AxiosInstance = axios.create({
  baseURL: 'http://127.0.0.1:8000',
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
