const express = require("express");
const router = express.Router();
const Product = require("../models/Product");
const { upload } = require("../utils/cloudinary");

// ----------------------
// SEED PRODUCTS (run once)
// ----------------------
router.post("/seed", async (req, res) => {
  const products = [
    { name: "5ml Fat wand tube", image: "productImages/5ml Fat wand tube.jpg", price: 9000, page: "mainWebsitePage.html" },
    { name: "Coloured pigment", image: "productImages/Coloured pigment.jpg", price: 8000, page: "mainWebsitePage.html" },
    { name: "Frosted lipbalm jar", image: "productImages/Frosted lipbalm jar.jpg", price: 10000, page: "mainWebsitePage.html" },
    { name: "Lipscrub jar", image: "productImages/Lipscrub jar.jpg", price: 10000, page: "mainWebsitePage.html" },
    { name: "TKB flavouring oil", image: "productImages/TKB flavouring oil.jpg", price: 10000, page: "mainWebsitePage.html" },
    { name: "Mushroom tube", image: "productImages/Mushroom tube.jpg", price: 10000, page: "mainWebsitePage.html" },
    { name: "Chapstick", image: "productImages/Chapstick.jpeg", price: 10000, page: "mainWebsitePage.html" },
    { name: "Versagel", image: "productImages/Versagel.jpg", price: 10000, page: "mainWebsitePage.html" },
    { name: "Fat head tube", image: "productImages/Fat head tube.jpg", price: 10000, page: "jikesShop2.html" },
    { name: "Metallic fat wand tube", image: "productImages/Metallic fat wand tube.jpg", price: 10000, page: "jikesShop2.html" },
    { name: "6ml Fat wand tube", image: "productImages/6ml Fat wand tube.jpg", price: 10000, page: "jikesShop2.html" },
    { name: "Chapstick filler", image: "productImages/Chapstick filler.jpg", price: 10000, page: "jikesShop2.html" },
    { name: "Popsicle tube", image: "productImages/Popsicle tube.jpg", price: 10000, page: "jikesShop2.html" },
    { name: "Packaging box", image: "productImages/Packaging box.jpg", price: 10000, page: "jikesShop2.html" },
    { name: "4ml Ball head tube", image: "productImages/4ml Ball head tube.jpg", price: 10000, page: "jikesShop2.html" },
    { name: "2-in-1 jar", image: "productImages/2-in-1 jar.jpg", price: 10000, page: "jikesShop2.html" },
    { name: "12-in-1 Fruit art", image: "productImages/12-in-1 Fruit art.jpg", price: 10000, page: "jikesShop3.html" },
    { name: "Barbie tubes", image: "productImages/Barbie tubes.jpg", price: 10000, page: "jikesShop3.html" },
    { name: "Coconut oil", image: "productImages/Coconut oil.png", price: 10000, page: "jikesShop3.html" },
    { name: "Face sheet mask", image: "productImages/Face sheet mask.jpg", price: 10000, page: "jikesShop3.html" },
    { name: "Pipette", image: "productImages/Pipette.jpg", price: 10000, page: "jikesShop3.html" },
    { name: "Pink holographic pouch", image: "productImages/pink holographic pouch.jpg", price: 10000, page: "jikesShop3.html" },
    { name: "10ml lipscrub jar", image: "productImages/10ml lipscrub jar.jpg", price: 10000, page: "jikesShop3.html" },
    { name: "Measuring cups", image: "productImages/Measuring cups.jpg", price: 10000, page: "jikesShop3.html" },
    { name: "Mica powder", image: "productImages/Mica powder.jpg", price: 10000, page: "jikesShop4.html" },
    { name: "Mixing bowl with spatula", image: "productImages/Mixing bowl with spatula.jpg", price: 10000, page: "jikesShop4.html" },
    { name: "Syringe", image: "productImages/Syringe.jpg", price: 10000, page: "jikesShop4.html" },
    { name: "10-in-1 lip mask", image: "productImages/10-in-1 lip mask.jpg", price: 10000, page: "jikesShop4.html" },
    { name: "Fruit art", image: "productImages/Fruit art.jpg", price: 10000, page: "jikesShop4.html" },
    { name: "Lip mask", image: "productImages/Lip mask.jpg", price: 10000, page: "jikesShop4.html" },
    { name: "Spatula", image: "productImages/Spatula.jpg", price: 10000, page: "jikesShop4.html" },
    { name: "Transparent tube", image: "productImages/Transparent tube.jpg", price: 10000, page: "jikesShop4.html" },
    { name: "10-in-1 tubes", image: "productImages/10-in-1 tubes.jpg", price: 10000, page: "jikesShop5.html" },
    { name: "Fat wand tube", image: "productImages/Fat wand tube.jpeg", price: 10000, page: "jikesShop5.html" },
    { name: "6ml Ball head tube", image: "productImages/6ml Ball head tube.jpeg", price: 10000, page: "jikesShop5.html" },
    { name: "Lip oil tube", image: "productImages/Lip oil tube.jpg", price: 10000, page: "jikesShop5.html" },
    { name: "Thank you bag", image: "productImages/Thank you bag.jpg", price: 10000, page: "jikesShop5.html" },
    { name: "Thank you card", image: "productImages/Thank you card.jpg", price: 10000, page: "jikesShop5.html" },
    { name: "Thank you nylon", image: "productImages/Thank you nylon.png", price: 10000, page: "jikesShop5.html" },
    { name: "Thank you sticker", image: "productImages/Thank you sticker.jpg", price: 10000, page: "jikesShop5.html" }
  ];

  try {
    // insertMany with ordered:false skips duplicates without failing
    await Product.insertMany(products, { ordered: false });
    res.json({ success: true, message: "Products seeded successfully!" });
  } catch (err) {
    if (err.code === 11000) {
      res.json({ success: true, message: "Products already seeded!" });
    } else {
      console.error("Seed error:", err);
      res.status(500).json({ success: false, message: "Seed failed" });
    }
  }
});

// ----------------------
// GET ALL PRODUCTS
// ----------------------
router.get("/", async (req, res) => {
  try {
    const products = await Product.find().sort({ name: 1 });
    res.json({ success: true, products });
  } catch (err) {
    console.error("Get products error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ----------------------
// GET SINGLE PRODUCT BY NAME
// ----------------------
router.get("/byname/:name", async (req, res) => {
  try {
    const product = await Product.findOne({ name: req.params.name });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, product });
  } catch (err) {
    console.error("Get product error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ----------------------
// GET PRODUCTS BY PAGE
// ----------------------
router.get("/page/:page", async (req, res) => {
  try {
    const products = await Product.find({ page: req.params.page }).sort({ name: 1 });
    res.json({ success: true, products });
  } catch (err) {
    console.error("Get products by page error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ----------------------
// GET PRODUCTS WITH PAGINATION
// ----------------------
router.get("/paginate", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const skip = (page - 1) * limit;

    const total = await Product.countDocuments();
    const products = await Product.find()
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      products,
      currentPage: page,
      totalPages,
      total
    });
  } catch (err) {
    console.error("Paginate products error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ----------------------
// ADD NEW PRODUCT
// ----------------------
router.post("/add", async (req, res) => {
  const { name, image, price, page, hasVariants, variantType, variants, description  } = req.body;

  if (!name || !image || !price || !page) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  try {
    const existing = await Product.findOne({ name });
    if (existing) {
      return res.status(400).json({ success: false, message: "Product already exists" });
    }

    const product = new Product({
      name, image, price, page, inStock: true,
      hasVariants: hasVariants || false,
      variantType: hasVariants ? variantType : null,
      variants: hasVariants ? variants : [],
      description: description || ""
    });
    await product.save();

    res.json({ success: true, message: "Product added successfully!", product });
  } catch (err) {
    console.error("Add product error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ----------------------
// EDIT PRODUCT
// ----------------------
router.put("/:productId", async (req, res) => {
  const { name, image, price, page, inStock, hasVariants, variantType, variants, description } = req.body;

  try {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    if (name) product.name = name;
    if (image) product.image = image;
    if (price) product.price = price;
    if (page) product.page = page;
    if (typeof inStock === "boolean") product.inStock = inStock;
    if (typeof hasVariants === "boolean") {
      product.hasVariants = hasVariants;
      product.variantType = hasVariants ? variantType : null;
      product.variants = hasVariants ? (variants || []) : [];
    }
    if (typeof description === "string") product.description = description;

    await product.save();
    res.json({ success: true, message: "Product updated!", product });
  } catch (err) {
    console.error("Edit product error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ----------------------
// DELETE PRODUCT
// ----------------------
router.delete("/:productId", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    res.json({ success: true, message: "Product deleted!" });
  } catch (err) {
    console.error("Delete product error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ----------------------
// TOGGLE STOCK STATUS
// ----------------------
router.put("/:productId/stock", async (req, res) => {
  const { inStock } = req.body;

  try {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    product.inStock = inStock;
    await product.save();

    res.json({ success: true, message: `Product marked as ${inStock ? "in stock" : "out of stock"}!`, product });
  } catch (err) {
    console.error("Toggle stock error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ----------------------
// UPLOAD PRODUCT IMAGE
// ----------------------
router.post("/upload-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image uploaded" });
    }

    res.json({
      success: true,
      imageUrl: req.file.path
    });
  } catch (err) {
    console.error("Image upload error:", err);
    res.status(500).json({ success: false, message: "Image upload failed" });
  }
});

// ----------------------
// GET SINGLE PRODUCT BY SLUG NAME
// ----------------------
router.get("/slug/:slug", async (req, res) => {
  try {
    const name = req.params.slug.replace(/-/g, " ");
    const product = await Product.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") }
    });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, product });
  } catch (err) {
    console.error("Get product by slug error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ----------------------
// GET SINGLE PRODUCT BY ID
// ----------------------
router.get("/:productId", async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, product });
  } catch (err) {
    console.error("Get product by ID error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
module.exports = router;