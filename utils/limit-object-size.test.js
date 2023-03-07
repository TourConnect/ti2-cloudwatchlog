const { limitObjectSize } = require('./limit-object-size.js');

describe("limitObjectSize", () => {
  test("should limit object size with nested attributes", () => {
    const myObj = {
      prop1: "value1",
      prop2: {
        subprop1: "subvalue1",
        subprop2: {
          subsubprop2: "subsubvalue2"
        }
      },
      prop3: "value3",
      prop4: "this is a very long string and should be trimmed ?",
    };
    const maxBytes = 150;
    const expectedObj = {
      prop1: "value1",
      prop2: {
        subprop1: 'subvalue1',
        subprop2: {
          subsubprop2: "subsubvalue2"
        }
      },
      prop3: 'value3',
      prop4: '...',
    };
    const result = limitObjectSize(myObj, maxBytes);
    expect(result).toEqual(expectedObj);
  });

  test("should return the same object if it's already within the byte limit", () => {
    const myObj = {
      prop1: "value1",
      prop2: {
        subprop1: "subvalue1"
      }
    };
    const maxBytes = 100;
    expect(limitObjectSize(myObj, maxBytes)).toEqual(myObj);
  });

  test("should handle empty objects", () => {
    const myObj = {};
    const maxBytes = 10;
    expect(limitObjectSize(myObj, maxBytes)).toEqual(myObj);
  });

  test("should limit object size with removing attributes", () => {
    const myObj = {
      prop1: "value1",
      prop2: {
        subprop1: "value2",
        subprop2longname: "value3",
      }
    };
    const maxBytes = 65;
    const expectedObj = {
      prop1: "value1",
      prop2: {
        subprop1: 'value2'
      }
    };
    const result = limitObjectSize(myObj, maxBytes);
    expect(result).toEqual(expectedObj);
  });

});

