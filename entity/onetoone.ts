import { Relationship } from "./relationship";
import { FireStoreQuery } from './query';

export function oneToOne(args: any) {

    function actualDecorator(target, property: string | symbol): void {
        if (args.document != undefined) {
            if (target._oneToOne == undefined)
                Object.defineProperty(target, '_oneToOne', {
                    value: [],
                    writable: true,
                    enumerable: true
                })

            target._oneToOne[args.document.name] = { document: args.document, property: property }
        }
    }

    // return the decorator
    return actualDecorator;
}

export class OneToOneRelationship extends Relationship {
   

    static _name = "_oneToOne"
    

    query(query:FireStoreQuery) {
        if(typeof this.metaData.get == "undefined"){
            return this.metaData.constructor.get(this.fireStore, query.value)
        }else{
            return this.metaData.get(this.fireStore, query.value)
        }
    }
}