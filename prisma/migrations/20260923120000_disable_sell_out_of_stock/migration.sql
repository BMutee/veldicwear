-- Force every product to stop "selling out of stock": inventory must always
-- decrement so stock can never oversell.
--
-- The decrement guard requires trackInventory = true AND sellOutOfStock = false.
-- Every product that had sellOutOfStock = true (CJ imports + any manually
-- enabled ones) also had trackInventory = false, so flip both here to make
-- local stock actually decrement.
UPDATE "Product"
SET "sellOutOfStock" = false,
    "trackInventory" = true
WHERE "sellOutOfStock" = true;

