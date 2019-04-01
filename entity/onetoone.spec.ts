import { OneToOneRelationship } from './onetoone';
import { Student } from "./tests/models";
import { Relationship } from "./relationship";

describe('OneToOneRelationship tests', () => {
    
    it("should create an array with oneToOne relationships", ()=>{
        let s = new Student(null);
        expect(s["_oneToOne"]).toBeDefined();
        expect(s["_oneToOne"]["Person"]).toBeDefined();
        expect(s["_oneToOne"]["Person"].document).toBeDefined();
        expect(s["_oneToOne"]["Person"].property).toBe("person");

        expect(s["_oneToOne"]["Scholarship"]).toBeDefined();
        expect(s["_oneToOne"]["Scholarship"].document).toBeDefined();
        expect(s["_oneToOne"]["Scholarship"].property).toBe("scholarship");
    })

    it("should return an array with relationships", ()=>{
        let s = new Student(null);
        let relationships = OneToOneRelationship.getFrom(s);
        expect(relationships).toBeDefined();
        expect(relationships["Person"]).toBeDefined();
        expect(relationships["Person"].document).toBeDefined();
        expect(relationships["Person"].property).toBe("person");

        expect(s["_oneToOne"]["Scholarship"]).toBeDefined();
        expect(s["_oneToOne"]["Scholarship"].document).toBeDefined();
        expect(s["_oneToOne"]["Scholarship"].property).toBe("scholarship");
    })

});