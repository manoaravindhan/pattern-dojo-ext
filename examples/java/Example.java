// examples/java/Example.java

public class Example {
    // Singleton-like pattern with public constructor
    public static Example INSTANCE = new Example();
    public Example() { }

    // Multiple instantiations
    public static class Worker { }
    public static void main(String[] args) {
        Worker w1 = new Worker();
        Worker w2 = new Worker();
        Worker w3 = new Worker();
    }
}
