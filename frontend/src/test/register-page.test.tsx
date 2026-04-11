import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RegisterPage from "@/pages/RegisterPage";
import apiClient from "@/api/apiClient";

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    register: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock("@/api/apiClient", () => ({
  default: {
    get: vi.fn(),
  },
}));

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads branches from API for branch dropdown", async () => {
    (apiClient.get as any).mockResolvedValueOnce({
      data: {
        data: [
          { id: 1, name: "Nairobi Branch", location: "Nairobi" },
          { id: 2, name: "Mombasa Branch", location: "Mombasa" },
        ],
      },
    });

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(apiClient.get).toHaveBeenCalledWith("/branches");
    });

    fireEvent.click(screen.getByText("Select your branch"));

    const nairobiOptions = await screen.findAllByText("Nairobi Branch");
    const mombasaOptions = await screen.findAllByText("Mombasa Branch");

    expect(nairobiOptions.length).toBeGreaterThan(0);
    expect(mombasaOptions.length).toBeGreaterThan(0);
  });
});
