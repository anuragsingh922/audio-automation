#include <iostream>
#include<algorithm>
#include<vector>
#include<map>
using namespace std;

int maximizeHolidayValue(int month, int lastCity, int remainingVisits, vector<vector<int>> &holidayValues, vector<vector<int>> &cityConnections, vector<int> &bestRoute, vector<vector<vector<int>>> &memo) {
    if (month == 12)
        return 0;

    if (month == 3 || month == 6 || month == 9) {
        remainingVisits = 2;
    }
    if (memo[lastCity][month][remainingVisits] != -1) {
        return memo[lastCity][month][remainingVisits];
    }
    if (remainingVisits == 0) {
        return holidayValues[lastCity][month] + maximizeHolidayValue(month + 1, lastCity, remainingVisits, holidayValues, cityConnections, bestRoute, memo);
    }

    int maxValue = INT_MIN;
    for (auto nextCity : cityConnections[lastCity]) {
        // Case of not taking the visit
        int valueWithoutVisit = holidayValues[lastCity][month] + maximizeHolidayValue(month + 1, lastCity, remainingVisits, holidayValues, cityConnections, bestRoute, memo);
        int valueWithVisit = holidayValues[nextCity][month] + maximizeHolidayValue(month + 1, nextCity, remainingVisits - 1, holidayValues, cityConnections, bestRoute, memo);
        
        if (valueWithoutVisit > valueWithVisit) {
            if (valueWithoutVisit > maxValue) {
                bestRoute[month] = lastCity;
                maxValue = valueWithoutVisit;
            }
        } else {
            if (valueWithVisit > maxValue) {
                bestRoute[month] = nextCity;
                maxValue = valueWithVisit;
            }
        }
    }
    return memo[lastCity][month][remainingVisits] = maxValue;
}

int main() {
    unordered_map<string, vector<string>> cityNeighborMap = {
        {"Noida", {"Delhi", "Gurugram", "Faridabad"}},
        {"Delhi", {"Noida", "Gurugram", "Sonipat", "Faridabad"}},
        {"Sonipat", {"Delhi", "Panipat", "Gurugram"}},
        {"Gurugram", {"Noida", "Delhi", "Sonipat", "Panipat", "Faridabad"}},
        {"Panipat", {"Sonipat", "Gurugram"}},
        {"Faridabad", {"Delhi", "Noida", "Gurugram"}}
    };

    int numCities = 6;
    vector<vector<int>> cityGraph(numCities);
    vector<string> cityNames = {"Noida", "Delhi", "Sonipat", "Gurugram", "Panipat", "Faridabad"};    
    cityGraph[0] = {1, 3, 5};
    cityGraph[1] = {0, 3, 2, 5};
    cityGraph[2] = {1, 3, 4};
    cityGraph[3] = {0, 1, 2, 4, 5};
    cityGraph[4] = {2, 3};
    cityGraph[5] = {1, 0, 3};

    unordered_map<string, vector<int>> cityHolidayValues = {
        {"Noida", {1, 3, 4, 2, 1, 5, 6, 5, 1, 7, 2, 1}},
        {"Delhi", {5, 1, 8, 2, 1, 7, 2, 6, 2, 8, 2, 6}},
        {"Sonipat", {2, 5, 8, 2, 1, 6, 9, 3, 2, 1, 5, 7}},
        {"Gurugram", {6, 4, 1, 6, 3, 4, 7, 3, 2, 5, 7, 8}},
        {"Panipat", {2, 4, 3, 1, 7, 2, 6, 8, 2, 1, 4, 6}},
        {"Faridabad", {2, 4, 6, 7, 2, 1, 3, 6, 3, 1, 6, 8}}
    };

    vector<vector<int>> holidayValues(numCities);
    holidayValues[0] = {1, 3, 4, 2, 1, 5, 6, 5, 1, 7, 2, 1};
    holidayValues[1] = {5, 1, 8, 2, 1, 7, 2, 6, 2, 8, 2, 6};
    holidayValues[2] = {2, 5, 8, 2, 1, 6, 9, 3, 2, 1, 5, 7};
    holidayValues[3] = {6, 4, 1, 6, 3, 4, 7, 3, 2, 5, 7, 8};
    holidayValues[4] = {2, 4, 3, 1, 7, 2, 6, 8, 2, 1, 4, 6};
    holidayValues[5] = {2, 4, 6, 7, 2, 1, 3, 6, 3, 1, 6, 8};

    vector<int> bestRoute(12);
    vector<vector<vector<int>>> memo(numCities, vector<vector<int>>(12, vector<int>(3, -1)));

    int maxHolidayValue = INT_MIN;
    for (int i = 0; i < numCities; i++) {
        int currentValue = holidayValues[i][0] + maximizeHolidayValue(1, i, 2, holidayValues, cityGraph, bestRoute, memo);
        if (currentValue > maxHolidayValue) {
            bestRoute[0] = i;
            maxHolidayValue = currentValue;
        }
    }

    for (int i = 0; i < 12; i++) {
        cout << cityNames[bestRoute[i]] << " -> ";
    }
    cout << endl << maxHolidayValue << endl;
}