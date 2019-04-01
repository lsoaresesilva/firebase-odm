import { Repository } from "./repository";
import { AngularFirestore } from "@angular/fire/firestore";
import { FireStoreQuery } from "./query";
import { Observable } from "rxjs";

export class FirestoreRepository implements Repository{
    
    add(fireStore?: AngularFirestore): Observable<any>{
        return null;
    }
    get(fireStore: AngularFirestore, id){
        
    }
    getAll(fireStore: AngularFirestore, collectionName?, query?:FireStoreQuery[], orderBy?, dynamicOrStatic?): Observable<any[]>{
        return null;
    }
    delete(collectionName?): Observable<void>{
        return null;
    }
    deleteAll(fireStore: AngularFirestore, collectionName?): Observable<void>{
        return null;
    }
    update(){

    }
    count(fireStore: AngularFirestore, collectionName?, query?:FireStoreQuery[]): Observable<number>{
        return null;
    }


}