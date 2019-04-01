# Object document mapper for Angular Firestore by Google's Firebase

Saving, reading and updating on Google Firebase with AngularFirestore is a tedious and repetitive task. This project aims to minimize this problem.

At the time, insert, read, list all, delete, delete all and count are working.
TODO: working to save relationships recursively and to update an entity.

# Use

1. Clone the repository to your project as a submodule: git add submodule https://github.com/lsoaresesilva/firebase-odm.git
3. Configure Firebase in your project
4. Run npm test, and verify if everything works as expected (it will run the unit tests)
5. Create a simple class and extend from Document
5. Inside your component, inject AngularFireStore
6. Pass this instance to the constructor of your class which extended from Document
6. Enjoy!

# Example

```javascript
\\file: person.ts

@Collection("personCollection")
export class Person extends Document{
  name:string;
}

\\file: your-component.ts

export class AppComponent {
  
  constructor(public db: AngularFirestore){
    let person = new Person(this.db);
    person.name = "Leonardo"
    person.add().subscribe(result=>{
      console.log(result.id) // optional
    });
    

    Person.get(this.db, 'your-entity-id').subscribe(
      document=>{ // its a person!},
      err=>{// ops, an error, maybe a document with this id does not exists.});
    Person.getAll(this.db).subscribe(result=>{ // list of persons}); //
    Person.count(this.db).subscribe(result=>{ // number of documents});

    person.delete();
    Person.deleteAll(this.db);
  }
}
```
