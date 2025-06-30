/** @odoo-module */

import { _t } from "@web/core/l10n/translation";
import { PaymentInterface } from "@point_of_sale/app/payment/payment_interface";
import { BillScreen } from "@pos_restaurant/app/bill_screen/bill_screen";
import { Dialog } from "@web/core/dialog/dialog";
const REQUEST_TIMEOUT = 5000

export class PaymentBTCPayPayment extends PaymentInterface {

    /**
    * @Override
    * @param { string } cid
    * @returns Promise
    */
    async send_payment_request(cid) {
        let order = this.pos.get_order();
        if (!order) {
            console.error("No order found");
            return false;
        }
        console.log(order.id);

        let line = this.pos.get_order().get_selected_paymentline();
        if (!line) {
        console.error("No selected payment line found");
        return false;
        }
        console.log(line.id);

        let order_id = this.pos.get_order().uuid;
        console.log(line.payment_method_id.id);
        console.log(line.amount);
        console.log(order_id);
        console.log(line.payment_method_id.use_payment_terminal);
        await super.send_payment_request(...arguments);
        let data = null;
        try {
	     /* data = await rpc.query({
              model: 'pos.payment.method',
              method: 'btcpay_create_crypto_invoice',
              args: [{pm_id: line.payment_method.id, amount: line.amount, order_id: order_id}],
            }, {
                silent: true,
            }); */
            data = await this.env.services.orm.silent.call(
              'pos.payment.method',
              'btcpay_create_crypto_invoice',
              [{pm_id: line.payment_method_id.id, amount: line.amount, order_id: order_id}],
             );
            console.log("called payment method");
			console.log(data);

        }
        catch (error) {
           console.error("error calling payment method");
           return false
        }
        if(data.code != '0'){
            alert('Create invoice error:'+ data.code);
            return false;}
        const codeWriter = new window.ZXing.BrowserQRCodeSvgWriter();
		console.log('logging data.cryptopay_payment_link');
        console.log(data.cryptopay_payment_link);
        //let qr_code_svg = line.cryptopay_payment_link;
        let qr_code_svg = new XMLSerializer().serializeToString(codeWriter.write(data.cryptopay_payment_link, 150, 150));
        line.is_crypto_payment = true;
        line.cryptopay_payment_link = data.cryptopay_payment_link;
        line.cryptopay_payment_link_qr_code = "data:image/svg+xml;base64,"+ window.btoa(qr_code_svg);
        line.cryptopay_invoice_id = data.invoice_id;
        line.invoiced_crypto_amount = data.crypto_amt;
        line.cryptopay_payment_type = data.cryptopay_payment_type;
        let conversion_rate = line.amount/(line.invoiced_crypto_amount/100000000);
        line.conversion_rate = conversion_rate.toFixed(2);
        console.log(line.is_crypto_payment);
        console.log(line.cryptopay_payment_link_qr_code);
        console.log(data.cryptopay_payment_type);
        console.log(line.invoiced_crypto_amount);
        console.log(line.conversion_rate);
        line.set_payment_status('cryptowaiting');

        return this._check_payment_status(line);
    }

    /**
     * @Override
     * @param {} order
     * @param { string } cid
     * @returns Promise
     */
    async send_payment_cancel(order, cid) {
        super.send_payment_cancel(...arguments);
    }

    async _check_payment_status(line) {
        let api_resp = null;

		try {
			let order_id = this.pos.get_order().uuid;
			console.log(order_id);
			console.log(line.payment_method_id.id);
			for (let i = 0; i < 100; i++) {
				line.crypto_payment_status = 'Checking Invoice status '+(i+1)+'/100';
				try {
                    api_resp = await this.env.services.orm.silent.call(
                       'pos.payment.method',
                       'btcpay_check_payment_status',
                        [{ invoice_id: line.cryptopay_invoice_id, pm_id: line.payment_method_id.id, order_id: order_id }],
                    );
					if (api_resp.status == 'Paid' || api_resp.status == 'Settled') {
						console.log("valid btcpay transaction - timer");
						line.crypto_payment_status = 'Invoice Paid';
						return true;
					}
					else if (api_resp.status == 'Expired' || api_resp.status == 'Invalid') {	
						console.log("invalid expired btcpay transaction - timer");
						alert('Check invoice error: Invoice has expired');
						line.crypto_payment_status = 'Invoice Expired';
						return false;
					}
				} catch (error) {
					console.log(error);
					return false;
				}
				await new Promise(r => setTimeout(r, 50000));
			}
		}
		catch (error) {
			console.error("An error occurred:", error.message);
		}
		finally {
			console.log("Completed ");
		}
        return false;
    }
}
