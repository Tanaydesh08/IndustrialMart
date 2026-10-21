package com.IndustrialMart.Backend.category;

import com.IndustrialMart.Backend.category.Category;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    private final List<Category> categories = List.of(
            new Category(1L, "Rice Milling Machinery",
                    "rice-milling-machinery",
                    "Machines used for rice milling and processing"),

            new Category(2L, "Complete Rice Mill Plants",
                    "complete-rice-mill-plants",
                    "Complete and turnkey rice mill processing plants."),

            new Category(3L, "Spare Parts & Components",
                    "spare-parts-components",
                    "Spare parts and replacement components for rice mills."),

            new Category(4L, "Material Handling Equipment",
                    "material-handling-equipment",
                    "Conveyors, elevators, silos and handling systems."),

            new Category(5L, "Sorting, Grading & Packaging",
                    "sorting-grading-packaging",
                    "Equipment for sorting, grading and packaging rice."),

            new Category(6L, "Electrical & Automation",
                    "electrical-automation",
                    "Motors, electrical panels and industrial automation."),

            new Category(7L, "Industrial Services",
                    "industrial-services",
                    "Installation, repair and maintenance services."),
            new Category(8L, "Truck", "truck", "Trucks and commercial vehicles.")
    );

    public List<Category> getAllCategories() {
        return categories;
    }
}
