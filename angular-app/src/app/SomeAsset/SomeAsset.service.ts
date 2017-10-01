import { Injectable } from '@angular/core';
import { DataService } from '../data.service';
import { Observable } from 'rxjs/Observable';
import { SomeAsset } from '../io.devorchestra.kyc';
import 'rxjs/Rx';

// Can be injected into a constructor
@Injectable()
export class SomeAssetService {

	
		private NAMESPACE: string = 'io.devorchestra.kyc.SomeAsset';
	



    constructor(private dataService: DataService<SomeAsset>) {
    };

    public getAll(): Observable<SomeAsset[]> {
        return this.dataService.getAll(this.NAMESPACE);
    }

    public getAsset(id: any): Observable<SomeAsset> {
      return this.dataService.getSingle(this.NAMESPACE, id);
    }

    public addAsset(itemToAdd: any): Observable<SomeAsset> {
      return this.dataService.add(this.NAMESPACE, itemToAdd);
    }

    public updateAsset(id: any, itemToUpdate: any): Observable<SomeAsset> {
      return this.dataService.update(this.NAMESPACE, id, itemToUpdate);
    }

    public deleteAsset(id: any): Observable<SomeAsset> {
      return this.dataService.delete(this.NAMESPACE, id);
    }

}
