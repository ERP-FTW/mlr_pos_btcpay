odoo.define('pos_btcpaypayment.models', function (require) {
var models = require('point_of_sale.models');
var PaymentbtcpayPayment = require('pos_btcpaypayment.payment');

models.register_payment_method('btcpay', PaymentbtcpayPayment);
});
