interface DataServiceResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

interface DataServiceRequest {
  query: string;
}

interface SqlRequest {
  sql: string;
}

class DataService {
  private baseUrl: string;
  private apiKey?: string;

  constructor(baseUrl: string = 'http://localhost:8000', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Send a user query to the data service and get a JSON response
   * @param query - The user's natural language query
   * @returns Promise with the service response
   */
  async sendPrompt(query: string): Promise<DataServiceResponse> {
    try {
      const requestBody: DataServiceRequest = {
        query
      };

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      // Add JWT token from localStorage if available
      const accessToken = localStorage.getItem('access_token');
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // Add API key if provided
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      console.log('Sending request to:', `${this.baseUrl}/generate-sql`);
      console.log('Request body:', requestBody);

      const response = await fetch(`${this.baseUrl}/generate-sql`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        mode: 'cors', // Explicitly set CORS mode
        credentials: 'include', // Include cookies for session-based auth
        cache: 'no-cache', // Prevent caching issues
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      return {
        success: true,
        data: data,
        message: 'Request processed successfully'
      };

    } catch (error) {
      console.error('DataService error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Unknown error occurred';
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error: Unable to connect to the data service. Please check if the service is running at http://localhost:8000';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage,
        message: 'Failed to process request'
      };
    }
  }

  /**
   * Execute SQL query
   * @param sql - The SQL query to execute
   * @returns Promise with the execution results
   */
  async executeSql(sql: string): Promise<DataServiceResponse> {
    try {
      const requestBody: SqlRequest = {
        sql
      };

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      // Add JWT token from localStorage if available
      const accessToken = localStorage.getItem('access_token');
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // Add API key if provided
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      console.log('Executing SQL:', sql);
      console.log('Sending request to:', `${this.baseUrl}/execute-sql`);

      const response = await fetch(`${this.baseUrl}/execute-sql`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
        mode: 'cors',
        credentials: 'include',
        cache: 'no-cache',
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('SQL execution response:', data);
      
      return {
        success: true,
        data: data,
        message: 'SQL executed successfully'
      };

    } catch (error) {
      console.error('SQL execution error:', error);
      
      let errorMessage = 'Unknown error occurred';
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error: Unable to connect to the data service';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage,
        message: 'Failed to execute SQL'
      };
    }
  }

  /**
   * Get service health status
   * @returns Promise with health status
   */
  async getHealth(): Promise<DataServiceResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data,
        message: 'Service is healthy'
      };

    } catch (error) {
      console.error('Health check error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed',
        message: 'Service is unavailable'
      };
    }
  }

  /**
   * Update the base URL for the service
   * @param newBaseUrl - New base URL
   */
  setBaseUrl(newBaseUrl: string): void {
    this.baseUrl = newBaseUrl;
  }

  /**
   * Update the API key
   * @param newApiKey - New API key
   */
  setApiKey(newApiKey: string): void {
    this.apiKey = newApiKey;
  }

  /**
   * Get models endpoint
   * @returns Promise with models array
   */
  async getModels(): Promise<DataServiceResponse> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      // Add JWT token from localStorage if available
      const accessToken = localStorage.getItem('access_token');
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      // Add API key if provided
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      console.log('Getting models from:', `${this.baseUrl}/get-models`);

      const response = await fetch(`${this.baseUrl}/get-models`, {
        method: 'GET',
        headers,
        mode: 'cors',
        credentials: 'include',
        cache: 'no-cache',
      });

      console.log('Get models response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Get models error:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Get models response data:', data);
      
      return {
        success: true,
        data: data,
        message: 'Models retrieved successfully'
      };

    } catch (error) {
      console.error('Get models error:', error);
      
      let errorMessage = 'Unknown error occurred';
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error: Unable to connect to the data service';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage,
        message: 'Failed to get models'
      };
    }
  }

 
}

export default DataService;
export type { DataServiceResponse, DataServiceRequest };
