import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MutableDataFrame,
  FieldType,
} from '@grafana/data';

import { MyQuery, MyDataSourceOptions } from './types';
import { getBackendSrv, getTemplateSrv } from '@grafana/runtime';
// import { map } from 'rxjs/operators';
import { lastValueFrom } from 'rxjs';

interface SvrResp {

  date: Date;

  occurrences: number;

}

export class DataSource extends DataSourceApi<MyQuery, MyDataSourceOptions> {
  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
  }

  async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
    const { range } = options;
    const from = range!.from.valueOf();
    const to = range!.to.valueOf();

    // Custom code starts here ...

    console.log('options', options);
    const query = getTemplateSrv().replace('$brics', options.scopedVars);
    console.log('query', query);

    const res = await this.getJwt();
    const sessionId: string = res.data;
    console.log('sessionId - ', sessionId);

    const res2 = this.getData(sessionId);
    const data2 = (await res2).data;
    console.log('data = ', data2);

    // End of custom code

    // Return a constant for each query.
    const data = options.targets.map((target) => {
      return new MutableDataFrame({
        refId: target.refId,
        fields: [
          { name: 'Time', values: [from, to], type: FieldType.time },
          { name: 'Value', values: [3, data2[2].occurrences], type: FieldType.number }, // Passing a data value from the getData() call.
        ],
      });
    });

    return { data };
  }

  // Calls custom web service for session id
  async getJwt() {
    const response = getBackendSrv().fetch<string>({
      url: `http://localhost:8080/adminJwt`
    });
    return await lastValueFrom(response);
  }

  // Calls custom web service for data. Includes the session id.
  async getData(sessionId: string) {
    const response = getBackendSrv().fetch<SvrResp[]>({
      url: `http://localhost:8080/get`,
      credentials: 'include',
      headers: {
          Cookie: 'JSESSIONID=' + sessionId
      }
    });
    return await lastValueFrom(response);
  }

  async testDatasource() {
    // Implement a health check for your data source.

    // Custom code starts here

    const response = await getBackendSrv().fetch<any>({
      url: 'http://localhost:8080/get',
      headers: {
        mode: 'no-cors'
      }
    });
    await lastValueFrom(response);

    // End of custom code

    return {
      status: 'success',
      message: 'Success',
    };
  }
}
