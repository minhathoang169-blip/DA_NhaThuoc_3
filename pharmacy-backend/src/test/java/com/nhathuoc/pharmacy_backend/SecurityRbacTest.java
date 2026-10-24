package com.nhathuoc.pharmacy_backend;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SecurityRbacTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("RBAC 1: Không có JWT Token gọi API POS Checkout -> Phải nhận HTTP 401 Unauthorized")
    void testUnauthenticatedPosCheckoutReturns401() throws Exception {
        mockMvc.perform(post("/api/v1/pos/checkout")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                            "items": [{"medicineId": "SP001", "quantity": 1}],
                            "customerPaid": 10000
                        }
                        """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @DisplayName("RBAC 2: CUSTOMER cố tình gọi API POS Checkout của Dược sĩ -> Phải nhận HTTP 403 Forbidden")
    @WithMockUser(username = "customer1", roles = {"CUSTOMER"})
    void testCustomerCallingPosCheckoutReturns403() throws Exception {
        mockMvc.perform(post("/api/v1/pos/checkout")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                            "items": [{"medicineId": "SP001", "quantity": 1}],
                            "customerPaid": 10000
                        }
                        """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @DisplayName("RBAC 3: CUSTOMER cố tình gọi Dashboard Metrics -> Phải nhận HTTP 403 Forbidden")
    @WithMockUser(username = "customer1", roles = {"CUSTOMER"})
    void testCustomerCallingDashboardReturns403() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard/metrics"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("RBAC 4: PHARMACIST gọi Dashboard Metrics và Cảnh báo Date -> Phải nhận HTTP 200 OK")
    @WithMockUser(username = "pharmacist1", roles = {"PHARMACIST"})
    void testPharmacistAccessingDashboardAndAlertsReturns200() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard/metrics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalRevenue").exists())
                .andExpect(jsonPath("$.revenueChart").isArray());

        mockMvc.perform(get("/api/v1/inventory/expiring-batches?days=30"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("RBAC 5: Public API tra cứu thuốc -> Khách vãng lai không cần đăng nhập vẫn xem được (200 OK)")
    void testPublicMedicineSearchReturns200() throws Exception {
        mockMvc.perform(get("/api/v1/medicines/search?q=Paracetamol"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("RBAC 6: ADMIN có quyền truy cập toàn quyền cấu hình nhân viên và nhà cung cấp (200 OK)")
    @WithMockUser(username = "admin1", roles = {"ADMIN"})
    void testAdminAccessAdminEndpointsReturns200() throws Exception {
        mockMvc.perform(get("/api/employees"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/suppliers"))
                .andExpect(status().isOk());
    }
}
