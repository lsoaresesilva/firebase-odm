import { Relationship } from "./relationship";
import { FireStoreQuery } from './query';

export function oneToMany(args: any) {

    function actualDecorator(target, property: string | symbol): void {
        if (args.document != undefined) {
            if (target._oneToMany == undefined)
                Object.defineProperty(target, '_oneToMany', {
                    value: [],
                    writable: true,
                    enumerable: true
                })

            target._oneToMany[args.document.constructor.name] = { document: args.document, property: property }
        }
    }

    // return the decorator
    return actualDecorator;
}

export class OneToManyRelationship extends Relationship {
    

    static _name = "_oneToMany"

    query(query:FireStoreQuery) {
        if(typeof this.metaData.get == "undefined"){
            return this.metaData.constructor.getAll(this.fireStore, query)
        }else{
            return this.metaData.getAll(this.fireStore, query)
        }
        
    }

}