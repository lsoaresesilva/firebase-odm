import { AngularFirestore } from "@angular/fire/firestore";
import { Observable } from "rxjs";
import { FireStoreQuery } from "./query";

export interface Repository{

    add(fireStore?: AngularFirestore): Observable<any>
    get(fireStore: AngularFirestore, id);
    getAll(fireStore: AngularFirestore, collectionName?, query?:FireStoreQuery[], orderBy?, dynamicOrStatic?): Observable<any[]>;
    delete(collectionName?): Observable<void>;
    deleteAll(fireStore: AngularFirestore, collectionName?): Observable<void>;
    update();
    count(fireStore: AngularFirestore, collectionName?, query?:FireStoreQuery[]): Observable<number>;
}