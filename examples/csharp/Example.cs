// examples/csharp/Example.cs
using System;

public class Database {
    public static Database Instance = new Database();
    public Database() { }
}

public class Worker { }

public class Program {
    public static void Main(string[] args) {
        var w1 = new Worker();
        var w2 = new Worker();
        var w3 = new Worker();
    }
}
