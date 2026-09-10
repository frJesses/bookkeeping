export type MiniProgramEnvironment = 'develop' | 'trial' | 'release'

const API_BASE_URLS: Record<MiniProgramEnvironment, string> = {
  develop: 'https://wwlblog.top/api',
  trial: 'https://wwlblog.top/api',
  release: 'https://wwlblog.top/api',
}

export function getMiniProgramEnvironment(): MiniProgramEnvironment {
  try {
    const envVersion = wx.getAccountInfoSync().miniProgram.envVersion
    if (envVersion === 'develop' || envVersion === 'trial' || envVersion === 'release') {
      return envVersion
    }
  } catch (error) {
    console.warn('get mini program environment failed', error)
  }
  return 'release'
}

export function getApiBaseURL() {
  return API_BASE_URLS[getMiniProgramEnvironment()]
}
