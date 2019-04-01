import { CollectionReference, Query } from "@angular/fire/firestore";

export class FireStoreQuery {

    constructor(public column, public comparison, public value) {

    }

    generate(ref: CollectionReference): Query {
        return ref.where(this.column, this.comparison, this.value)
    }

    static generateMultipleQuery(queries: FireStoreQuery[], ref: CollectionReference) {
        if (queries != undefined && Array.isArray(queries)) {
            let query: Query;
            for (let i = 0; i < queries.length; i++) {
                if (i == 0)
                    query = queries[i].generate(ref)
                else {
                    query = query.where(queries[i].column, queries[i].comparison, queries[i].value);
                }
            }

            return query;
        }else{
            return ref;
        }
    }


}