const DATA_MODEL_PATHS = {
    decisionTree: "data-model/decision_tree_model.pkl",
    featureScaler: "data-model/feature_scaler.pkl",
    logisticRegression: "data-model/logistic_regression_model.pkl",
    orthoSuitability: "data-model/ortho_suitability_model.pkl",
} as const;


export function getMockScaledFeatures(_rawFeatures: number[]): number[] {
    // In production: load from DATA_MODEL_PATHS.featureScaler and transform
    return _rawFeatures;
}

export function getMockSuitabilityFromModels(_features: number[]): boolean {
    // In production: load from DATA_MODEL_PATHS.decisionTree or DATA_MODEL_PATHS.logisticRegression
    return false;
}
