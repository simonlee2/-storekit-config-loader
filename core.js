import { api } from './node-app-store-connect-api.js';
import fs from 'fs';

export const generator = async function Generator({ appId, issuerId, apiKey, privateKey }) {
  const { readAll, read } = await api({ issuerId, apiKey, privateKey });

  async function readPriceForIap(inAppPurchase) {
    const { data: inAppPurchasePrices, included: { inAppPurchasePricePoints } } =
      await readAll(`inAppPurchasePriceSchedules/${inAppPurchase.id}/manualPrices`,
        {
          params: {
            include: "inAppPurchasePricePoint",
            "filter[territory]": "USA",
          }
        }
      );

    const currentPriceObject = inAppPurchasePrices.find(
      price => price.attributes.startDate === null
    );

    const currentPricePoint = inAppPurchasePricePoints[
      currentPriceObject.relationships.inAppPurchasePricePoint.data.id
    ];

    return currentPricePoint;
  }

  async function readLocalizationForIap(inAppPurchase) {
    const { data: inAppPurchaseLocalizations } = await readAll(`v2/inAppPurchases/${inAppPurchase.id}/inAppPurchaseLocalizations`,
      {
        params: {
          "fields[inAppPurchaseLocalizations]": "name,description,locale",
        }
      }
    );

    return inAppPurchaseLocalizations.map(localization => ({
      description: localization.attributes.description,
      displayName: localization.attributes.name,
      locale: localization.attributes.locale,
    }));
  }

  async function fetchSubscriptionGroups(appId) {
    const { data: subscriptionGroups } = await readAll(`v1/apps/${appId}/subscriptionGroups`);

    console.log(`Fetched ${subscriptionGroups.length} subscription groups`)
    return subscriptionGroups;
  }

  async function fetchSubscriptionLocalizations(subscription) {
    console.log(`Fetching localizations for subscription ${subscription.id}...`);
    const { data: subscriptionLocalizations } = await readAll(`v1/subscriptions/${subscription.id}/subscriptionLocalizations`);

    console.log(`Fetched ${subscriptionLocalizations.length} subscription localizations`)
    return subscriptionLocalizations.map(localization => ({
      description: localization.attributes.description,
      displayName: localization.attributes.name,
      locale: localization.attributes.locale,
    }));
  }

  async function fetchSubscriptionIntroductoryOffers(subscription) {
    console.log(`Fetching introductory offers for subscription ${subscription.id}...`);
    const { data: introductoryOffers } = await readAll(`v1/subscriptions/${subscription.id}/introductoryOffers`,
      {
        params: {
          "filter[territory]": "USA"
        }
      }
    );

    return introductoryOffers.map(introductoryOffer => ({
      internalID: introductoryOffer.id,
      numberOfPeriods: introductoryOffer.attributes.numberOfPeriods,
      paymentMode: convertOfferMode(introductoryOffer.attributes.offerMode),
      subscriptionPeriod: convertSubscriptionPeriod(introductoryOffer.attributes.duration)
    }));
  }

  async function fetchSubscriptionPrice(subscription) {
    console.log(`Fetching price for subscription ${subscription.id}...`);
    const { data: subscriptionPrices, included: { subscriptionPricePoints } } = await readAll(`v1/subscriptions/${subscription.id}/prices`,
      {
        params: {
          include: "subscriptionPricePoint",
          "filter[territory]": "USA"
        }
      }
    );

    const currentPriceObject = subscriptionPrices.find(
      price => price.attributes.startDate === null
    );

    const currentPricePoint = subscriptionPricePoints[
      currentPriceObject.relationships.subscriptionPricePoint.data.id
    ];

    return currentPricePoint.attributes.customerPrice;
  }

  async function fetchSubscriptions(subscriptionGroup) {
    const { data: subscriptions } = await readAll(`v1/subscriptionGroups/${subscriptionGroup.id}/subscriptions`);
    console.log(`Fetched ${subscriptions.length} subscriptions for subscription group ${subscriptionGroup.id}...`);

    let processedSubscriptions = [];

    for (const subscription of subscriptions) {
      const processedSubscription = {
        adHocOffers: [],
        codeOffers: [],
        displayPrice: await fetchSubscriptionPrice(subscription), // fetch from relationships
        familyShareable: subscription.attributes.familySharable,
        groupNumber: subscription.attributes.groupLevel,
        internalID: subscription.id,
        introductoryOffer: await fetchSubscriptionIntroductoryOffers(subscription),
        localizations: await fetchSubscriptionLocalizations(subscription),
        productID: subscription.attributes.productId,
        recurringSubscriptionPeriod: convertSubscriptionPeriod(subscription.attributes.subscriptionPeriod),
        referenceName: subscription.attributes.name,
        subscriptionGroupID: subscriptionGroup.id,
        type: "RecurringSubscription", // needs conversion
      }

      processedSubscriptions.push(processedSubscription);
    }
    return processedSubscriptions;
  }


  /*-------------------------------------------------------------------------------------------------*/

  async function loadProducts(appId) {
    const { data: inAppPurchases } = await readAll(`v1/apps/${appId}/inAppPurchasesV2`);

    console.log(`Fetched ${inAppPurchases.length} in-app purchases`);

    let products = [];
    for (const inAppPurchase of inAppPurchases) {
      const { attributes: { _, customerPrice } } = await readPriceForIap(inAppPurchase);
      const inAppPurchaseLocalizations = await readLocalizationForIap(inAppPurchase);
      const displayPrice = customerPrice;
      const internalID = inAppPurchase.id;
      const familyShareable = inAppPurchase.attributes.familySharable;
      const type = convertProductType(inAppPurchase.attributes.inAppPurchaseType);
      const productID = inAppPurchase.attributes.productId
      const referenceName = inAppPurchase.attributes.name;
      const localizations = inAppPurchaseLocalizations;
      const product = {
        displayPrice,
        familyShareable,
        internalID,
        localizations,
        productID,
        referenceName,
        type
      }
      products.push(product);
      console.log(`Processed ${products.length} of ${inAppPurchases.length}`);
    }

    return products;
  }

  async function loadNonRenewingSubscriptions() {
    return [];
  }

  async function loadSettings() {
    return {
      "_applicationInternalID": "448639966",
      "_developerTeamID": "F6J8Q2Y2Q9",
      "_lastSynchronizedDate": 697370746.61363602
    }
  }

  async function loadVersion() {
    return {
      "major": 2,
      "minor": 0
    }
  }

  async function loadIdentifier() {
    return "800085FC"
  }

  async function loadSubscriptionGroups(appId) {
    const subscriptionGroups = await fetchSubscriptionGroups(appId);

    let processedSubscriptionGroups = [];

    for (const subscriptionGroup of subscriptionGroups) {
      const subscriptions = await fetchSubscriptions(subscriptionGroup);

      const processedSubscriptionGroup = {
        "id": subscriptionGroup.id,
        "name": subscriptionGroup.attributes.referenceName,
        "localizations": [],
        "subscriptions": subscriptions,
      };

      processedSubscriptionGroups.push(processedSubscriptionGroup);
    }

    return processedSubscriptionGroups;
  }

  /*------------------------------- Type conversion ---------------------------------------------*/

  function convertProductType(type) {
    switch (type) {
      case "CONSUMABLE":
        return "Consumable";
      case "NON_CONSUMABLE":
        return "NonConsumable";
      case "NON_RENEWING_SUBSCRIPTION":
        return "NonRenewingSubscription";
      case "RECURRING_SUBSCRIPTION":
        return "RecurringSubscription";
      default:
        return "UNKNOWN";
    }
  }

  function convertSubscriptionPeriod(period) {
    switch (period) {
      case "ONE_YEAR":
        return "P1Y";
      case "THREE_MONTHS":
        return "P3M";
      case "ONE_MONTH":
        return "P1M";
      case "ONE_WEEK":
        return "P1W";
      case "THREE_YEARS":
        return "P3Y";
      case "TWO_YEARS":
        return "P2Y";
      default:
        return "UNKNOWN";
    }
  }

  function convertOfferMode(mode) {
    switch (mode) {
      case "FREE_TRIAL":
        return "free";
      case "PAY_AS_YOU_GO":
        return "payAsYouGo";
      case "PAY_UP_FRONT":
        return "payUpFront";
      default:
        return "unknown";
    }
  }

  async function generate(filename) {
    const identifier = await loadIdentifier();
    const nonRenewingSubscriptions = await loadNonRenewingSubscriptions();
    const products = await loadProducts(appId);
    const settings = await loadSettings();
    const subscriptionGroups = await loadSubscriptionGroups(appId);
    const version = await loadVersion();

    const output = {
      identifier,
      nonRenewingSubscriptions,
      products,
      settings,
      subscriptionGroups,
      version
    }

    // Convert JSON data to a string
    const jsonString = JSON.stringify(output, null, 2);

    // Write JSON data to a file
    fs.writeFile(filename, jsonString, (err) => {
      if (err) {
        console.error('Error writing JSON data to file:', err);
      } else {
        console.log('JSON data successfully written to file.');
      }
    });
  };

  return { generate };
}
