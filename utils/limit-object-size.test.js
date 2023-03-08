const { limitObjectSize } = require('./limit-object-size.js');

describe("limitObjectSize", () => {
  test.only("should limit object size with nested attributes", () => {
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
    const maxKB = 150/1024;
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
    const result = limitObjectSize(myObj, maxKB);
    expect(result).toEqual(expectedObj);
  });

  test("should return the same object if it's already within the byte limit", () => {
    const myObj = {
      prop1: "value1",
      prop2: {
        subprop1: "subvalue1"
      }
    };
    const maxKB = 100/1024;
    expect(limitObjectSize(myObj, maxKB)).toEqual(myObj);
  });

  test("should handle empty objects", () => {
    const myObj = {};
    const maxKB = 1;
    expect(limitObjectSize(myObj, maxKB)).toEqual(myObj);
  });

  test("should limit object size with removing attributes", () => {
    const myObj = {
      prop1: "value1",
      prop2: {
        subprop1: "value2",
        subprop2longname: "value3",
      }
    };
    const maxKB = 10/1024;
    const expectedObj = {
      prop1: "value1",
      prop2: {
        subprop1: 'value2'
      }
    };
    const result = limitObjectSize(myObj, maxKB);
    expect(result).toEqual(expectedObj);
  });

});

