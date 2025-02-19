export class fetchModule {
  settings = {
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
    },
  }

  constructor (host = 'https://localhost', settings = this.settings) {
    this.host = host;
  }

  doFetchRequest (url = this.host, methodType = 'GET', body = {}) {
    const fetchOptions = {
      method: methodType,
      headers: this.settings.headers,
    }

    if (methodType != 'GET') {
      fetchOptions.body = JSON.stringify(body);
    }

    return fetch(this.host + url, fetchOptions);
  }

  get (url, body) {
    return this.doFetchRequest(url, 'GET', body);
  }

  post (url, body) {
    return this.doFetchRequest(url, 'POST', body);
  }

  put (url, body) {
    return this.doFetchRequest(url, 'PUT', body);
  }
}

export const fetchApi = new fetchModule('https://checkinfly.ru/api/');
