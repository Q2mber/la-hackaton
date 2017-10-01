import { Component, OnInit, Input } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { DocumentService } from './Document.service';
import 'rxjs/add/operator/toPromise';
@Component({
	selector: 'app-Document',
	templateUrl: './Document.component.html',
	styleUrls: ['./Document.component.css'],
  providers: [DocumentService]
})
export class DocumentComponent implements OnInit {

  myForm: FormGroup;

  private allAssets;
  private asset;
  private currentId;
	private errorMessage;

  
      
          documentId = new FormControl("", Validators.required);
        
  
      
          hash = new FormControl("", Validators.required);
        
  
      
          secret = new FormControl("", Validators.required);
        
  
      
          owner = new FormControl("", Validators.required);
        
  
      
          type = new FormControl("", Validators.required);
        
  
      
          status = new FormControl("", Validators.required);
        
  


  constructor(private serviceDocument:DocumentService, fb: FormBuilder) {
    this.myForm = fb.group({
    
        
          documentId:this.documentId,
        
    
        
          hash:this.hash,
        
    
        
          secret:this.secret,
        
    
        
          owner:this.owner,
        
    
        
          type:this.type,
        
    
        
          status:this.status
        
    
    });
  };

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): Promise<any> {
    let tempList = [];
    return this.serviceDocument.getAll()
    .toPromise()
    .then((result) => {
			this.errorMessage = null;
      result.forEach(asset => {
        tempList.push(asset);
      });
      this.allAssets = tempList;
    })
    .catch((error) => {
        if(error == 'Server error'){
            this.errorMessage = "Could not connect to REST server. Please check your configuration details";
        }
        else if(error == '404 - Not Found'){
				this.errorMessage = "404 - Could not find API route. Please check your available APIs."
        }
        else{
            this.errorMessage = error;
        }
    });
  }

	/**
   * Event handler for changing the checked state of a checkbox (handles array enumeration values)
   * @param {String} name - the name of the asset field to update
   * @param {any} value - the enumeration value for which to toggle the checked state
   */
  changeArrayValue(name: string, value: any): void {
    const index = this[name].value.indexOf(value);
    if (index === -1) {
      this[name].value.push(value);
    } else {
      this[name].value.splice(index, 1);
    }
  }

	/**
	 * Checkbox helper, determining whether an enumeration value should be selected or not (for array enumeration values
   * only). This is used for checkboxes in the asset updateDialog.
   * @param {String} name - the name of the asset field to check
   * @param {any} value - the enumeration value to check for
   * @return {Boolean} whether the specified asset field contains the provided value
   */
  hasArrayValue(name: string, value: any): boolean {
    return this[name].value.indexOf(value) !== -1;
  }

  addAsset(form: any): Promise<any> {
    this.asset = {
      $class: "io.devorchestra.kyc.Document",
      
        
          "documentId":this.documentId.value,
        
      
        
          "hash":this.hash.value,
        
      
        
          "secret":this.secret.value,
        
      
        
          "owner":this.owner.value,
        
      
        
          "type":this.type.value,
        
      
        
          "status":this.status.value
        
      
    };

    this.myForm.setValue({
      
        
          "documentId":null,
        
      
        
          "hash":null,
        
      
        
          "secret":null,
        
      
        
          "owner":null,
        
      
        
          "type":null,
        
      
        
          "status":null
        
      
    });

    return this.serviceDocument.addAsset(this.asset)
    .toPromise()
    .then(() => {
			this.errorMessage = null;
      this.myForm.setValue({
      
        
          "documentId":null,
        
      
        
          "hash":null,
        
      
        
          "secret":null,
        
      
        
          "owner":null,
        
      
        
          "type":null,
        
      
        
          "status":null 
        
      
      });
    })
    .catch((error) => {
        if(error == 'Server error'){
            this.errorMessage = "Could not connect to REST server. Please check your configuration details";
        }
        else{
            this.errorMessage = error;
        }
    });
  }


   updateAsset(form: any): Promise<any> {
    this.asset = {
      $class: "io.devorchestra.kyc.Document",
      
        
          
        
    
        
          
            "hash":this.hash.value,
          
        
    
        
          
            "secret":this.secret.value,
          
        
    
        
          
            "owner":this.owner.value,
          
        
    
        
          
            "type":this.type.value,
          
        
    
        
          
            "status":this.status.value
          
        
    
    };

    return this.serviceDocument.updateAsset(form.get("documentId").value,this.asset)
		.toPromise()
		.then(() => {
			this.errorMessage = null;
		})
		.catch((error) => {
            if(error == 'Server error'){
				this.errorMessage = "Could not connect to REST server. Please check your configuration details";
			}
            else if(error == '404 - Not Found'){
				this.errorMessage = "404 - Could not find API route. Please check your available APIs."
			}
			else{
				this.errorMessage = error;
			}
    });
  }


  deleteAsset(): Promise<any> {

    return this.serviceDocument.deleteAsset(this.currentId)
		.toPromise()
		.then(() => {
			this.errorMessage = null;
		})
		.catch((error) => {
            if(error == 'Server error'){
				this.errorMessage = "Could not connect to REST server. Please check your configuration details";
			}
			else if(error == '404 - Not Found'){
				this.errorMessage = "404 - Could not find API route. Please check your available APIs."
			}
			else{
				this.errorMessage = error;
			}
    });
  }

  setId(id: any): void{
    this.currentId = id;
  }

  getForm(id: any): Promise<any>{

    return this.serviceDocument.getAsset(id)
    .toPromise()
    .then((result) => {
			this.errorMessage = null;
      let formObject = {
        
          
            "documentId":null,
          
        
          
            "hash":null,
          
        
          
            "secret":null,
          
        
          
            "owner":null,
          
        
          
            "type":null,
          
        
          
            "status":null 
          
        
      };



      
        if(result.documentId){
          
            formObject.documentId = result.documentId;
          
        }else{
          formObject.documentId = null;
        }
      
        if(result.hash){
          
            formObject.hash = result.hash;
          
        }else{
          formObject.hash = null;
        }
      
        if(result.secret){
          
            formObject.secret = result.secret;
          
        }else{
          formObject.secret = null;
        }
      
        if(result.owner){
          
            formObject.owner = result.owner;
          
        }else{
          formObject.owner = null;
        }
      
        if(result.type){
          
            formObject.type = result.type;
          
        }else{
          formObject.type = null;
        }
      
        if(result.status){
          
            formObject.status = result.status;
          
        }else{
          formObject.status = null;
        }
      

      this.myForm.setValue(formObject);

    })
    .catch((error) => {
        if(error == 'Server error'){
            this.errorMessage = "Could not connect to REST server. Please check your configuration details";
        }
        else if(error == '404 - Not Found'){
				this.errorMessage = "404 - Could not find API route. Please check your available APIs."
        }
        else{
            this.errorMessage = error;
        }
    });

  }

  resetForm(): void{
    this.myForm.setValue({
      
        
          "documentId":null,
        
      
        
          "hash":null,
        
      
        
          "secret":null,
        
      
        
          "owner":null,
        
      
        
          "type":null,
        
      
        
          "status":null 
        
      
      });
  }

}
