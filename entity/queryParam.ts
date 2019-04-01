import { FireStoreQuery } from './query';
import { AngularFirestore } from '@angular/fire/firestore';
export class QueryParam{

    constructor(public query:FireStoreQuery, public fireStore:AngularFirestore){

    }

    static validateQueryArgs(query:QueryParam) {
        /*if( args.length == 2 ){
            let containsFireStore;
            let containsId;
            let containsEntity;
            Reflect.ownKeys(args).forEach(element => {
                if (args[element] instanceof AngularFirestore) {
                    containsFireStore = true;
                }

                

                if(typeof args[element] == "string"){
                    containsId = true;
                }
            })

            if(containsFireStore && containsId){
                return true;
            }else{
                return false;
            }
        }

        return false;*/
    }
}