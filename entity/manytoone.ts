import { Relationship } from "./relationship";
import { FireStoreQuery } from "./query";

export function manyToOne(args: any) {

    function actualDecorator(target, property: string | symbol): void {
        if (args.document != undefined) {
            if (target._manyToOne == undefined)
                Object.defineProperty(target, '_manyToOne', {
                    value: [],
                    writable: true,
                    enumerable: true
                })

            target._manyToOne[args.document.name] = { document: args.document, property: property }
        }
    }

    // return the decorator
    return actualDecorator;
}

export class ManyToOneRelationship extends Relationship{

    static _name = "_manyToOne";

    query(query: FireStoreQuery) {
        if(typeof this.metaData.get == "undefined"){
            return this.metaData.constructor.get(this.fireStore, query.value)
        }else{
            return this.metaData.get(this.fireStore, query.value)
        }
    }

}