package de.pasci.f1manager;

/** F1 Konstrukteure (4×2): Teamwertung. */
public class ConstructorsWidget extends BaseWidget {
    @Override String kind() { return "constructors"; }
    @Override int maxDrivers() { return 0; }
    @Override boolean needTeam() { return false; }
}
