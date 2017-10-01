import { Injectable } from '@angular/core';
import { DataService } from '../data.service';
import { Observable } from 'rxjs/Observable';
import { Document } from '../io.devorchestra.kyc';
import 'rxjs/Rx';

// Can be injected into a constructor
@Injectable()
export class DocumentService {

	
		private NAMESPACE: string = 'io.devorchestra.kyc.Document';
	



    constructor(private dataService: DataService<Document>) {
    };

    public getAll(): Observable<Document[]> {
        return this.dataService.getAll(this.NAMESPACE);
    }

    public getAsset(id: any): Observable<Document> {
      return this.dataService.getSingle(this.NAMESPACE, id);
    }

    public addAsset(itemToAdd: any): Observable<Document> {
      return this.dataService.add(this.NAMESPACE, itemToAdd);
    }

    public updateAsset(id: any, itemToUpdate: any): Observable<Document> {
      return this.dataService.update(this.NAMESPACE, id, itemToUpdate);
    }

    public deleteAsset(id: any): Observable<Document> {
      return this.dataService.delete(this.NAMESPACE, id);
    }

}
