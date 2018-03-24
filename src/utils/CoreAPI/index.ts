import HTTPCode from '@/utils/HTTPCode';
import { CoreUpdateRequest, CoreCreationRequest, CoreRow } from '@/store/types';
import { AuthenticationError } from '@/errors/AuthenticationError';
import TokenService from '@/services/Token';

/** Paths on Core for specific data tables */
export type CorePath = '/people/farmers' | '/transactions/products/milk' | '/transactions/products/export' | '/transactions/money/loan';

const LOGIN_PATH = '/actions/authenticate';

/** Types of methods to interact with the core */
type CoreRequestMethod
  = 'GET'     // Retrieve
  | 'POST'    // Create
  | 'PUT'     // Update
  | 'HEAD'    // Timestamp
  ;

/**
 * API for interacting with the core
 */
export default class CoreAPI {
  private url: string;

  constructor(path: CorePath) {
    this.url = `${process.env.CORE_HOST}:${process.env.CORE_PORT}${path}`;
  }

  /**
   * Attempt to login
   *
   * @param username Username to login with
   * @param password Password to login with
   *
   * @return {boolean} Success status (true if successful)
   */
  // tslint:disable-next-line:function-name
  public static async login({ username, password }: {username: string, password: string}): Promise<{ uuid: string, jwt: string }> {
    const url = `${process.env.CORE_HOST}:${process.env.CORE_PORT}${LOGIN_PATH}`;
    const method: CoreRequestMethod = 'POST';
    const headers = new Headers({
      'content-type': 'application/json',
    });

    const body = {
      username,
      password,
    };

    const request = new Request(url, {
      method,
      headers,
      body: JSON.stringify(body),
    });

    const response = await fetch(request);

    // Check response
    if (!response.ok) throw new AuthenticationError();

    const { token: jwt, uuid } = await response.json();
    TokenService.token = jwt;

    return { uuid, jwt };
  }

  /**
   * Get a row from the core
   *
   * @param uuid UUID of the desired row
   *
   * @returns
   */
  public async get<T>(uuid: string): Promise<CoreRow<T>> {
    const url = `${this.url}/${uuid}`;
    const method: CoreRequestMethod = 'GET';
    const request = new Request(url, this.getOptions(method));

    return await this.coreFetch(request) as CoreRow<T>;
  }

  /**
   * Get all of the specified resource
   */
  public async getAll<T>(): Promise<CoreRow<T>[]> {
    const url = this.url;
    const method: CoreRequestMethod = 'GET';
    const request = new Request(url, this.getOptions(method));

    return this.coreFetch(request);
  }

  /**
   * Update a row on the core
   *
   * @param row Information to overwrite
   */
  public async update<T>(row: CoreUpdateRequest<T>): Promise<CoreRow<T>> {
    const url = this.url;
    const method: CoreRequestMethod = 'PUT';
    const request = new Request(url, this.getOptions(method, row));

    return this.coreFetch(request);
  }

  /**
   * Create a row in the database
   *
   * @param row Row to create
   */
  public async create<T>(row: CoreCreationRequest<T>) {
    const url = this.url;
    const method: CoreRequestMethod = 'POST';
    const request = new Request(url, this.getOptions(method, row));

    return this.coreFetch(request);
  }

  /**
   * Send a HEAD request for the resources
   *
   * @param timestamp Timestamp to compare
   */
  public async head(timestamp: string) {

  }

  private getOptions<T>(method: CoreRequestMethod, body?: T): RequestInit {

    const jwt = TokenService.token;
    if (!jwt) {
      throw new Error('Not authenticated');
    }
    const headers = new Headers({
      'content-type': 'application/json',
      Authorization: `Bearer ${jwt}`,
    });

    return {
      method,
      headers,
      mode: 'cors',
      ...body && { body: JSON.stringify(body) },
    };
  }

  private async coreFetch(request: Request) {
    // Declare block scoped variables (let) at top of block
    let response: Response;

    { let attempts: number = 0;
      const maxAttempts = 10;

      // Make request, attempt request again if 500 received
      do {
        // tslint:disable-next-line:no-console
        attempts && console.log('request failed with 500, making another attempt');
        response = await fetch(request);
      } while (response.status === HTTPCode.INTERNAL_SERVER_ERROR && attempts++ < maxAttempts);
    }

    if (!response.ok) {
      if (response.status === HTTPCode.UNAUTHORIZED) {
        TokenService.token = '';
      }
      throw response;
    }

    else return await response.json();
  }
}