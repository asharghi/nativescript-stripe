import { Injectable } from "@angular/core";
import * as httpModule from "http";
import { StripeBackendAPI, StripeConfig, StripeCustomerSession, StripePaymentListener, StripePaymentSession, StripeShippingAddressField } from "nativescript-stripe";
import { Page } from "ui/page";

// 1) To get started with this demo, first head to https://dashboard.stripe.com/account/apikeys
// and copy your "Test Publishable Key" (it looks like pk_test_abcdef) into the line below.
const publishableKey = "pk_test_s3dHtM9w6XmgB7ak7AbCSj51";

// 2) Next, optionally, to have this demo save your user's payment details, head to
// https://github.com/stripe/example-ios-backend , click "Deploy to Heroku", and follow
// the instructions (don't worry, it's free). Paste your Heroku URL below
// (it looks like https://blazing-sunrise-1234.herokuapp.com ).
const backendBaseURL = "https://rg-example-stripe-backend.herokuapp.com/";

// 3) Optionally, to enable Apple Pay, follow the instructions at https://stripe.com/docs/mobile/apple-pay
// to create an Apple Merchant ID. Paste it below (it looks like merchant.com.yourappname).
const appleMerchantID = "merchant.com.hearingclinic.hearingaids";

@Injectable()
export class StripeService implements StripeBackendAPI {
    private customerSession: StripeCustomerSession;

    constructor() {
        StripeConfig.shared().backendAPI = this;
        StripeConfig.shared().publishableKey = publishableKey;
        StripeConfig.shared().appleMerchantID = appleMerchantID;
        StripeConfig.shared().companyName = "Demo Company";
        StripeConfig.shared().requiredShippingAddressFields = StripeShippingAddressField.PostalAddress;

        this.customerSession = new StripeCustomerSession();
    }

    private backendURL(pathComponent: string): string {
        if (!backendBaseURL) throw new Error("backendBaseURL must be set");
        if (!backendBaseURL.endsWith("/")) {
            return backendBaseURL + "/" + pathComponent;
        } else {
            return backendBaseURL + pathComponent;
        }
    }

    createCustomerKey(apiVersion: string): Promise<any> {
        let url = this.backendURL("ephemeral_keys");
        return httpModule.request({
            url: url,
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" },
            content: "api_version=" + apiVersion
        }).then(response => {
            if (response.statusCode < 200 || response.statusCode >= 300) {
                throw new Error(response.content.toString());
            }
            return response.content.toJSON();
        });
    }

    completeCharge(stripeID: string, amount: number, shippingHash: string): Promise<void> {
        let url = this.backendURL("charge");
        return httpModule.request({
            url: url,
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" },
            content:
                "source=" + stripeID +
                "&amount=" + amount +
                "&" + shippingHash
        }).then(response => {
            if (response.statusCode < 200 || response.statusCode >= 300) {
                throw new Error(response.content.toString());
            }
        });
    }

    createPaymentSession(page: Page, price: number, listener?: StripePaymentListener): StripePaymentSession {
        return new StripePaymentSession(page, this.customerSession, price, "usd", listener);
    }

    showPaymentMethods(paymentSession: StripePaymentSession) {
        paymentSession.presentPaymentMethods();
    }

    showShipping(paymentSession: StripePaymentSession) {
        paymentSession.presentShipping();
    }

    requestPayment(paymentSession: StripePaymentSession) {
        paymentSession.requestPayment();
    }
}