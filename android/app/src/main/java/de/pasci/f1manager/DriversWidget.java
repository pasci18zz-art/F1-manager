package de.pasci.f1manager;

/** F1 Meine Fahrer (4×2): Bis zu drei Fahrer deiner Wahl. */
public class DriversWidget extends BaseWidget {
    @Override String kind() { return "mine"; }
    @Override int maxDrivers() { return 3; }
    @Override boolean needTeam() { return false; }
}
