# mlr_pos_btcpay

Lightning Rod Point of Sale BTCPay server extension module Readme

Overview
<br>This custom module for Odoo 16+ to add BTCPay server as a payment method to the Point-of-Sale application. BTCPay server acts as a payment gateway/provider for Bitcoin on-chain and lightning transactions, and is queried by API calls from Odoo. BTCPay server is added as a new electronic payment method to the POS and BTCPay server access is provided by API to Odoo. The payment method can be set to provide a web URL for the customer to pay on a BTCPay server portal site or lightning/on-chain invoice so they pay directly from their wallet. A created invoice for an order is printed on the bill receipt for scanning by customers on paper or the screen. A customer can choose to pay in Lightning or a traditional payment method. The POS Validate payment button will check the status of the invoice and mark the order as paid if the invoice is settled. The method will also check the status of the payment every minute and validate the payment if made. Conversion rate and invoiced satoshis are stored for each order.

Prerequisites (versions)
<br>Compatible with Odoo 16
<br>Postgres 14+
<br>BTCpay server connected to Lightning node

Installation (see this video for tutorial on Odoo module installation)
1. Download repository and place extracted folder in the Odoo addons folder.
2. Login to Odoo database to upgrade and enable developer mode under settings.
3. Under apps Update the App list.
4. Search for the module (MLR) and install.

Setup

1. In Odoo navigate to Point of Sale-> Configuration -> Payment Methods .
2. Click New to create a new record.
![image](https://github.com/ERP-FTW/mlr_pos_btcpay/assets/124227412/959a7ae4-e2d2-410f-a92c-2b1d9bf9a22e)
4. Enter a Name for the Payment Method (Bitcoin is suggested), select the journal as Bank, and select BTCPay from the Use Electronic Payment Terminal section.
5. Login into BTCPay server to be used and navigate to Account -> Manage Account -> Account Settings -> API Keys. Create a key for use with Odoo by click generate key, enter a label, select permissions (unrestricted access), and click Generate API key at the bottom of the page.
   ![image](https://github.com/ERP-FTW/mlr_pos_btcpay/assets/124227412/b32a5147-a31c-4fe7-8bbd-e405871a06de)
   ![image](https://github.com/ERP-FTW/mlr_pos_btcpay/assets/124227412/daf994e4-6bb8-454e-bd8a-46c19bc0f30b)
   - Also make sure to set Store Settings -> Rates -> Default Currency Pairs and the Default currency_pair to match your companies currency (BTC_USD).
   ![image](https://github.com/ERP-FTW/mlr_pos_btcpay/assets/124227412/60c44631-0511-4008-83de-43c80e9ff8b2)
7. From BTCPay server the following information and paste in the Odoo Payment Method record: the server base URL (https://xx.com), API key, and store ID.
![image](https://github.com/ERP-FTW/mlr_pos_btcpay/assets/124227412/6019899d-fe9d-48ad-97ba-51c2c1d24c37)
8. Select the payment flow of either Payment Link or Direct Invoice. Payment link will create a URL for the customer to visit to pay with either Bitcoin on-chain or with lightning. Direct Invoice currently requires the shop to select either on-chain or lightning to present to the customer. It is possible to create Payment Methods with identical BTCPay server access information but different payment flows that can be used side-by-side in the POS.
9. Set the minimum and maximum payment amount in fiat, the BTCPay server range is 1 satoshi minimum to unlimited value maximum, so determine a corresponding amount for your Odoo set currency.
10. Click Test Cryptopay Server Connection to verify the information is correct. If it is correct a green popup will affirm so, if it is incorrect a red popup will appear.
![image](https://github.com/ERP-FTW/mlr_pos_btcpay/assets/124227412/0bd1bcd8-b6a0-411d-8d6d-232d15c84787)
11. Save the record.
12. In Configuration -> Payment Methods add the newly created method and save.
![image](https://github.com/ERP-FTW/mlr_pos_btcpay/assets/124227412/2509ad4e-4d0c-4d87-9f01-5c832b895b23)


Operation
1. From the Point of Sale Dashboard open a New Session.
2. After creating an order navigate to the payment screen and select the created Payment Method. On the Payment Line click Send to generate the payment information.

4. The Payment Line will display the Checking Invoice Status count and have a button Show receipt to view the invoice QR code on the bill receipt. 

6. The QR code can be presented to the customer on the screen or with a printed receipt. Click Ok to navigate back to the Payment Screen.

7. If the customer paid with Lightning click Validate to confirm and close the order, if the invoice is unpaid a message will alert the user and an alternative payment method can be used. If the customer wishes to use another payment method, exe out the payment line and use the other payment method.


8. Lightning payment information, satoshi amount and conversion rate, will be stored on the payment model. To view after closing the session navigate to Orders-> Payments and open a specific record.


