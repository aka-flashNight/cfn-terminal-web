import axios, { type AxiosInstance } from 'axios'

// 相对路径，请求发往当前页所在端口（开发 5173 / 打包后 7078），由该端口代理 /api 到后端 7077
export const BASE_URL = ''

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
